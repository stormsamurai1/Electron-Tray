//resolve = Electron use caminhos relativos
//basename = Pegar nome do projeto
const {resolve, basename} = require('path')

//Roda comandos de terminal independente da plataforma
const spawn = require('cross-spawn')

//Concerta problemas de path relativo em alguns
//sistemas que não aceitam spawn
const FixPath = require('fix-path');

const { app ,Menu, Tray, dialog} = require('electron')

const nedb = require('nedb')
const dataBase = new nedb({
    filename: "data/database.js",
    autoload: true
})

FixPath();


//Concerto rápido para o problema do Tray
//icon desaparecendo rapidamente
//Fonte do problema: variavel cai no garbage Collector
let tray = null

async function render(){
    if(!tray.isDestroyed()){
        tray.destroy();
        tray = new Tray(resolve(__dirname,'assets','mainIcon.png'))
    }

    const storedProjects = new Promise((resolve,reject) =>{
        dataBase.find({},(err,doc)=>{
            try{
                resolve(doc)
            }catch(e){
                console.log(e)
            }
        })
    })
    const projetos = await storedProjects

    const projects = [projetos] ? projetos : []
    

    const itens = projects.map((project)=>{
        return { label: project.name,
                 submenu: [
                    {
                         label: 'Abrir no VSCode',
                         click: () => {
                            spawn.sync('code', [project.path], {stdio: 'inherit'})
                        }
                    },
                    {
                        label: 'Remover',
                        click: () =>{
                            dataBase.remove({path: project.path})
                            render()
                        }
                    }
                 ]
        }
    })    


    const contextMenu = Menu.buildFromTemplate([
        {
            //Remova se quiser o icone do VSCode
            //icon: resolve(__dirname,'assets','mainIcon.png'),

            label: 'Adicionar novo projeto ...',
            click:()=>{
                const result = dialog.showOpenDialogSync({ properties: ['openDirectory']})
                
                if(!result){ return }

                const [path] = result
                
                const name = basename(path)

                dataBase.insert({
                    path,
                    name
                })

                render();
            }
        },
        {
            type: 'separator'
        },
        ...itens,
        {
            type: 'separator'
        },
    ])


    tray.setContextMenu(contextMenu)
}

app.on('ready', () =>{
    tray = new Tray(resolve(__dirname,'assets','mainIcon.png'))
    
    
    render();
})
