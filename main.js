//resolve = Electron use caminhos relativos
//basename = Pegar nome do projeto
const {resolve, basename} = require('path')
//Roda comandos de terminal independente da plataforma
const spawn = require('cross-spawn')
//Concerta problemas de path relativo em alguns
//sistemas que não aceitam spawn
const FixPath = require('fix-path');

const { app ,Menu, Tray, dialog} = require('electron')

const schema = {
    projects: {
        type: "string",
    }
}

FixPath();

const Store = require('electron-store')
const store = new Store({ schema })

//store.clear()

//Concerto rápido para o problema do Tray
//icon desaparecendo rapidamente
//Fonte do problema: variavel cai no garbage Collector
let tray = null

function render(){
    if(!tray.isDestroyed()){
        tray.destroy();
        tray = new Tray(resolve(__dirname,'assets','mainIcon.png'))
    }

    const storedProjects = store.get('projects')
    const projects = storedProjects ? JSON.parse(storedProjects) : []

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
                            store.set('projects',JSON.stringify(projects.filter( item => item.path != project.path)));

                            render()
                        }
                    }
                 ]
        }
    })    


    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Adicionar novo projeto ...',
            click:()=>{
                const result = dialog.showOpenDialogSync({ properties: ['openDirectory']})
                
                if(!result){ return }

                const [path] = result
                
                const name = basename(path)

                store.set('projects', JSON.stringify([
                {
                    path,
                    name
                },... projects]))
                
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
